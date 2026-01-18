package com.example.moviebooking.dto;

import java.util.List;

public class HoldSeatRequest {
    private List<Long> seatIds;
    private UserDetailsDTO userDetails;

    public List<Long> getSeatIds() {
        return seatIds;
    }

    public void setSeatIds(List<Long> seatIds) {
        this.seatIds = seatIds;
    }

    public UserDetailsDTO getUserDetails() {
        return userDetails;
    }

    public void setUserDetails(UserDetailsDTO userDetails) {
        this.userDetails = userDetails;
    }
}
