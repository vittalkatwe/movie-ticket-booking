package com.example.moviebooking.dto;

import java.util.List;

public class CreateSeatsRequest {

    private List<String> seatNumbers;

    public List<String> getSeatNumbers() {
        return seatNumbers;
    }

    public void setSeatNumbers(List<String> seatNumbers) {
        this.seatNumbers = seatNumbers;
    }
}
