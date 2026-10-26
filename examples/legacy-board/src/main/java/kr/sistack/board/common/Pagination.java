package kr.sistack.board.common;

public class Pagination {
    private int page = 1;
    private int total;

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        if (page < 1 || page > 100000) {
            throw new IllegalArgumentException("페이지 범위를 확인하세요");
        }
        this.page = page;
    }

    public int getPageSize() {
        return 10;
    }

    public int getOffset() {
        return (page - 1) * getPageSize();
    }

    public int getEndRow() {
        return page * getPageSize();
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getLastPage() {
        return Math.max(1, (total + getPageSize() - 1) / getPageSize());
    }
}
