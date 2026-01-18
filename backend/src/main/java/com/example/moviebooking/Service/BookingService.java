package com.example.moviebooking.Service;

import com.example.moviebooking.Entity.Hold;
import com.example.moviebooking.Entity.HoldStatus;
import com.example.moviebooking.Entity.Seat;
import com.example.moviebooking.Entity.SeatStatus;
import com.example.moviebooking.dto.HoldSeatRequest;
import com.example.moviebooking.repository.HoldRepository;
import com.example.moviebooking.repository.SeatRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;         

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final SeatRepository seatRepository;
    private final HoldRepository holdRepository;

    public BookingService(SeatRepository seatRepository, HoldRepository holdRepository) {
        this.seatRepository = seatRepository;
        this.holdRepository = holdRepository;
    }

    @Transactional
    public List<Long> holdSeats(HoldSeatRequest request) {
        List<Long> holdIds = new ArrayList<>();

        for (Long seatId : request.getSeatIds()) {
            Seat seat = seatRepository.lockSeat(seatId)
                    .orElseThrow(() -> new RuntimeException("Seat not found: " + seatId));

            if (seat.getStatus() != SeatStatus.AVAILABLE) {
                throw new RuntimeException("Seat " + seat.getSeatNumber() + " is not available");
            }

            // Update seat status to HELD
            seat.setStatus(SeatStatus.HELD);
            seatRepository.save(seat);

            // Create hold record
            Hold hold = new Hold(
                    seat,
                    request.getUserDetails().getName(),
                    request.getUserDetails().getEmail(),
                    request.getUserDetails().getPhone()
            );
            hold = holdRepository.save(hold);
            holdIds.add(hold.getId());
        }

        return holdIds;
    }

    @Transactional
    public void confirmBooking(List<Long> holdIds) {
        List<Hold> holds = holdRepository.findByIdIn(holdIds);

        for (Hold hold : holds) {
            hold.setStatus(HoldStatus.COMPLETED);
            Seat seat = hold.getSeat();
            seat.setStatus(SeatStatus.BOOKED);
            seatRepository.save(seat);
            holdRepository.save(hold);
        }
    }

    @Transactional
    public void releaseExpiredHolds() {
        LocalDateTime now = LocalDateTime.now();
        List<Hold> expiredHolds = holdRepository.findExpiredHolds(now);

        for (Hold hold : expiredHolds) {
            hold.setStatus(HoldStatus.EXPIRED);
            Seat seat = hold.getSeat();
            seat.setStatus(SeatStatus.AVAILABLE);
            seatRepository.save(seat);
            holdRepository.save(hold);
        }
    }

    @Transactional
    public void releaseHolds(List<Long> holdIds) {
        List<Hold> holds = holdRepository.findByIdIn(holdIds);

        for (Hold hold : holds) {
            if (hold.getStatus() == HoldStatus.ACTIVE) {
                hold.setStatus(HoldStatus.EXPIRED);
                Seat seat = hold.getSeat();
                seat.setStatus(SeatStatus.AVAILABLE);
                seatRepository.save(seat);
                holdRepository.save(hold);
            }
        }
    }
}