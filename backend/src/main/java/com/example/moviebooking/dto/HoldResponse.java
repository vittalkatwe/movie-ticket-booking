package com.example.moviebooking.dto;

import java.util.List;

class HoldResponse {
    private boolean success;
    private List<Long> holdIds;
    private String message;

    public HoldResponse(boolean success, List<Long> holdIds, String message) {
        this.success = success;
        this.holdIds = holdIds;
        this.message = message;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public List<Long> getHoldIds() {
        return holdIds;
    }

    public void setHoldIds(List<Long> holdIds) {
        this.holdIds = holdIds;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
