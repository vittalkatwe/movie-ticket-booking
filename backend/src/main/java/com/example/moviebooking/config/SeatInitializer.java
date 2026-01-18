package com.example.moviebooking.config;

import com.example.moviebooking.Entity.Seat;
import com.example.moviebooking.Entity.SeatStatus;
import com.example.moviebooking.repository.SeatRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class SeatInitializer {

    private final SeatRepository seatRepository;
    private static final int INITIAL_SEAT_COUNT = 20;
    private static final double DEFAULT_SEAT_PRICE = 150.0;

    public SeatInitializer(SeatRepository seatRepository) {
        this.seatRepository = seatRepository;
    }

    @PostConstruct
    public void initializeSeats() {
        long availableSeats = seatRepository.countByStatus(SeatStatus.AVAILABLE);
        long totalSeats = seatRepository.count();

        System.out.println("===========================================");
        System.out.println("Seat Initialization Check");
        System.out.println("Total seats in database: " + totalSeats);
        System.out.println("Available seats: " + availableSeats);
        System.out.println("===========================================");

        if (availableSeats < INITIAL_SEAT_COUNT) {
            int seatsToAdd = INITIAL_SEAT_COUNT - (int) availableSeats;
            System.out.println("⚠️ Less than " + INITIAL_SEAT_COUNT + " available seats!");
            System.out.println("Creating " + seatsToAdd + " new seats...");

            createSeats(seatsToAdd);

            System.out.println("✅ Successfully created " + seatsToAdd + " seats");
            System.out.println("Total available seats now: " + INITIAL_SEAT_COUNT);
            System.out.println("===========================================");
        } else {
            System.out.println("✅ Sufficient seats available. No action needed.");
            System.out.println("===========================================");
        }
    }

    private void createSeats(int count) {
        long existingSeats = seatRepository.count();
        int startNumber = (int) existingSeats + 1;

        for (int i = 0; i < count; i++) {
            int seatNum = startNumber + i;
            String seatNumber = generateSeatNumber(seatNum);
            Seat seat = new Seat(seatNumber, DEFAULT_SEAT_PRICE, SeatStatus.AVAILABLE);
            seatRepository.save(seat);
        }
    }

    /**
     * Generate seat number in format: A1, A2, ... A10, B1, B2, etc.
     */
    private String generateSeatNumber(int seatNum) {
        int row = (seatNum - 1) / 10; // 10 seats per row
        int seatInRow = ((seatNum - 1) % 10) + 1;
        char rowLetter = (char) ('A' + row);
        return rowLetter + String.valueOf(seatInRow);
    }
}