package com.example.moviebooking.Service;

import com.example.moviebooking.Entity.Seat;
import com.example.moviebooking.Entity.SeatStatus;
import com.example.moviebooking.repository.SeatRepository;
import com.example.moviebooking.repository.HoldRepository;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SeatResetScheduler {

    private final SeatRepository seatRepository;
    private final HoldRepository holdRepository;

    public SeatResetScheduler(SeatRepository seatRepository,
                                   HoldRepository holdRepository) {
        this.seatRepository = seatRepository;
        this.holdRepository = holdRepository;
    }

    // Run every 5 hours from the time the app starts
    @Scheduled(fixedRate = 5 * 60 * 60 * 1000)
    @Transactional
    public void resetSeatsDaily() {
        // Clear all holds
        holdRepository.deleteAll();

        // Reset all seats to AVAILABLE
        List<Seat> allSeats = seatRepository.findAll();
        for (Seat seat : allSeats) {
            seat.setStatus(SeatStatus.AVAILABLE);
        }
        seatRepository.saveAll(allSeats);

        System.out.println("✓ Daily seat reset completed");
    }
}