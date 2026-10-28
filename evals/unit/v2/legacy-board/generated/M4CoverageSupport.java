package kr.sistack.board;

import java.lang.reflect.*;
import java.util.*;
import java.sql.Connection;
import org.junit.Before;
import org.junit.After;
import static org.junit.Assert.*;
import org.h2.jdbcx.JdbcDataSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mockito.Mockito;

public abstract class M4CoverageSupport {
    private JdbcDataSource data;
    private SqlSession session;
    private JdbcTemplate jdbc;
    protected abstract String[] mapperTypes();

    @Before public void 준비() throws Exception {
        data = new JdbcDataSource(); data.setURL("jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=Oracle;DB_CLOSE_DELAY=-1"); data.setUser("sa");
        ResourceDatabasePopulator seed = new ResourceDatabasePopulator(new ClassPathResource("db/schema.sql"), new ClassPathResource("db/data.sql"));
        seed.setSqlScriptEncoding("UTF-8"); seed.execute(data);
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean(); bean.setDataSource(data);
        bean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources("classpath*:mapper/*.xml"));
        SqlSessionFactory factory = bean.getObject();
        for (String type : mapperTypes()) { Class<?> cls = Class.forName(type); if (!factory.getConfiguration().hasMapper(cls)) factory.getConfiguration().addMapper(cls); }
        session = factory.openSession(true); jdbc = new JdbcTemplate(data);
    }

    @After public void 종료() throws Exception {
        if (session != null) session.close();
        if (data != null) try (Connection c = data.getConnection()) { c.createStatement().execute("SHUTDOWN"); }
    }

    protected Map<String, Object> values(String[] keys, Object[] vals) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        for (int i = 0; i < keys.length; i++) result.put(keys[i], vals[i]); return result;
    }
    private Object convert(Object value, Class<?> type) {
        if (value instanceof Number) {
            if (type == int.class || type == Integer.class) return ((Number) value).intValue();
            if (type == long.class || type == Long.class) return ((Number) value).longValue();
        }
        return value;
    }
    private Object bean(String type, Map<String, Object> values) throws Exception {
        Object result = Class.forName(type).getDeclaredConstructor().newInstance();
        for (Map.Entry<String, Object> e : values.entrySet()) {
            String setter = "set" + Character.toUpperCase(e.getKey().charAt(0)) + e.getKey().substring(1);
            Method found = null;
            for (Method m : result.getClass().getMethods()) if (m.getName().equals(setter) && m.getParameterCount() == 1) found = m;
            if (found == null) throw new IllegalArgumentException("fixture setter 없음: " + setter);
            found.invoke(result, convert(e.getValue(), found.getParameterTypes()[0]));
        }
        return result;
    }
    private Object read(Object bean, String property) throws Exception {
        return bean.getClass().getMethod("get" + Character.toUpperCase(property.charAt(0)) + property.substring(1)).invoke(bean);
    }
    private Object mapperCall(String owner, String method, Object argument) throws Exception {
        Class<?> cls = Class.forName(owner);
        Method found = null;
        for (Method m : cls.getMethods()) if (m.getName().equals(method) && m.getParameterCount() == 1) {
            if (found != null) throw new IllegalArgumentException("Mapper overload 미확정"); found = m;
        }
        if (found == null) throw new IllegalArgumentException("Mapper 메서드 없음");
        return found.invoke(session.getMapper(cls), argument);
    }
    private void reset(String table, Map<String, Object>[] rows) {
        jdbc.update("DELETE FROM " + table);
        for (Map<String, Object> row : rows) {
            String placeholders = String.join(",", Collections.nCopies(row.size(), "?"));
            jdbc.update("INSERT INTO " + table + " (" + String.join(",", row.keySet()) + ") VALUES (" + placeholders + ")", row.values().toArray());
        }
    }

    protected void branch(String owner, String method, String type, Map<String, Object> input,
            String table, String keyColumn, String keyProperty, Map<String, Object>[] rows, long[] expected) throws Exception {
        reset(table, rows);
        Object parameter = bean(type, input);
        try {
            assertEquals("분기 검사는 첫 페이지", 1, ((Number) read(parameter, "page")).intValue());
            assertTrue("분기 표본은 페이지 제한 안에 있어야 한다", rows.length <= ((Number) read(parameter, "pageSize")).intValue());
        } catch (NoSuchMethodException ignored) { }
        Object result = mapperCall(owner, method, parameter);
        if (result instanceof Number) assertEquals("분기 조건에 맞는 전체 건수", expected.length, ((Number) result).intValue());
        else {
            List<Long> actual = new ArrayList<Long>();
            for (Object row : (Collection<?>) result) actual.add(((Number) read(row, keyProperty)).longValue());
            Collections.sort(actual); List<Long> ids = new ArrayList<Long>(); for (long id : expected) ids.add(id);
            assertEquals("분기 조건에 맞는 행 집합", ids, actual);
        }
    }

    @SuppressWarnings("unchecked")
    protected void writeColumn(String owner, String method, String type, Map<String, Object> input,
            String table, String keyColumn, String keyProperty, Map<String, Object> original,
            String column, String property, boolean insert) throws Exception {
        reset(table, new Map[]{original});
        Object value = bean(type, input);
        Object expected = read(value, property);
        if (!insert) assertNotEquals("해당 SET 컬럼의 값이 실제로 바뀌어야 한다", original.get(column), expected);
        Object affected = mapperCall(owner, method, value);
        if (affected instanceof Number) assertEquals("저장 대상 한 건", 1, ((Number) affected).intValue());
        if (insert) expected = read(value, property);
        Object key = read(value, keyProperty);
        Map<String, Object> stored = jdbc.queryForMap("SELECT * FROM " + table + " WHERE " + keyColumn + " = ?", key);
        Object actual = stored.get(column);
        if (expected instanceof Number && actual instanceof Number) assertEquals("컬럼 재조회: " + column,
            new java.math.BigDecimal(expected.toString()).stripTrailingZeros(), new java.math.BigDecimal(actual.toString()).stripTrailingZeros());
        else assertEquals("컬럼 재조회: " + column, expected, actual);
    }

    protected void serviceBoundary(String owner, String method, String inputType, Map<String, Object> input,
            String[] fieldNames, String[] fieldTypes, boolean rejected) throws Exception {
        Object service = Class.forName(owner).getDeclaredConstructor().newInstance();
        for (int i = 0; i < fieldNames.length; i++) {
            Object mock = Mockito.mock(Class.forName(fieldTypes[i]), call -> {
                Class<?> returns = call.getMethod().getReturnType();
                if (returns == int.class) return 1; if (returns == long.class) return 1L;
                return org.mockito.Answers.RETURNS_DEFAULTS.answer(call);
            });
            ReflectionTestUtils.setField(service, fieldNames[i], mock);
        }
        Object bean = bean(inputType, input); Method selected = null;
        for (Method m : service.getClass().getMethods()) if (m.getName().equals(method) && Arrays.asList(m.getParameterTypes()).contains(bean.getClass())) {
            if (selected != null) throw new IllegalArgumentException("Service overload 미확정"); selected = m;
        }
        if (selected == null) throw new IllegalArgumentException("Service 진입 메서드 없음");
        Object[] args = new Object[selected.getParameterCount()];
        for (int i = 0; i < args.length; i++) { Class<?> t = selected.getParameterTypes()[i];
            if (t == bean.getClass()) args[i] = bean;
            else if (t == String.class) args[i] = "업무담당자";
            else if (t == long.class) args[i] = 1L;
            else if (t == int.class) args[i] = 1;
            else throw new IllegalArgumentException("진입 인자 fixture 필요");
        }
        Throwable failure = null;
        try { selected.invoke(service, args); } catch (InvocationTargetException e) { failure = e.getCause(); }
        if (rejected) assertTrue("거부 경계에서는 입력 오류", failure instanceof IllegalArgumentException);
        else assertNull("허용 경계에서는 정상 처리", failure);
    }
}
