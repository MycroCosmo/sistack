package kr.sistack.board.domain;

import java.sql.Date;
import java.time.LocalDate;
import kr.sistack.board.common.Pagination;

public class BoardSearch extends Pagination {
    private String searchType = "title";
    private String keyword = "";
    private String startDate = "";
    private String endDate = "";
    private String sort = "createdAt";

    public String getSearchType() {
        return searchType;
    }

    public void setSearchType(String value) {
        if (!"title".equals(value) && !"author".equals(value)) {
            throw new IllegalArgumentException("검색 조건을 확인하세요");
        }
        searchType = value;
    }

    public String getKeyword() {
        return keyword;
    }

    public void setKeyword(String value) {
        if (value == null || value.length() > 100) {
            throw new IllegalArgumentException("검색어 길이를 확인하세요");
        }
        keyword = value;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String value) {
        if (!value.isEmpty()) {
            LocalDate.parse(value);
        }
        startDate = value;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String value) {
        if (!value.isEmpty()) {
            LocalDate.parse(value);
        }
        endDate = value;
    }

    public Date getFromDate() {
        return startDate.isEmpty() ? null : Date.valueOf(startDate);
    }

    public Date getUntilDate() {
        return endDate.isEmpty() ? null : Date.valueOf(LocalDate.parse(endDate).plusDays(1));
    }

    public String getSort() {
        return sort;
    }

    public void setSort(String value) {
        if (!"createdAt".equals(value) && !"title".equals(value)) {
            throw new IllegalArgumentException("정렬 조건을 확인하세요");
        }
        sort = value;
    }

    public String getSortColumn() {
        return "title".equals(sort) ? "b.TITLE" : "b.CREATED_AT";
    }
}
