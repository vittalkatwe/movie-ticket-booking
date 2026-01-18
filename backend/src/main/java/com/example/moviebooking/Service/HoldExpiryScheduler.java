package com.example.moviebooking.Service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class HoldExpiryScheduler {

    private final BookingService bookingService;

    public HoldExpiryScheduler(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // Run every minute to release expired holds
    @Scheduled(fixedRate = 60000) // 60000 ms = 1 minute
    public void releaseExpiredSeats() {
        bookingService.releaseExpiredHolds();
    }
}