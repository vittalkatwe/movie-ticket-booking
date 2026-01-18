package com.example.moviebooking.controller;

import com.example.moviebooking.Entity.Seat;
import com.example.moviebooking.Entity.SeatStatus;
import com.example.moviebooking.Service.BookingService;
import com.example.moviebooking.dto.CreateSeatsRequest;
import com.example.moviebooking.dto.HoldSeatRequest;
import com.example.moviebooking.repository.SeatRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/seats")
@CrossOrigin
public class SeatController {

    private final SeatRepository seatRepository;
    private final BookingService bookingService;

    public SeatController(SeatRepository seatRepository,
                          BookingService bookingService) {
        this.seatRepository = seatRepository;
        this.bookingService = bookingService;
    }

    @GetMapping
    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    @PostMapping("/hold")
    public ResponseEntity<Map<String, Object>> holdSeats(@RequestBody HoldSeatRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<Long> holdIds = bookingService.holdSeats(request);
            response.put("success", true);
            response.put("holdIds", holdIds);
            response.put("message", "Seats held successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/bulk")
    public List<Seat> createSeats(@RequestBody CreateSeatsRequest request) {
        List<Seat> seats = request.getSeatNumbers()
                .stream()
                .map(seatNumber -> new Seat(seatNumber, 150.0, SeatStatus.AVAILABLE))
                .toList();

        return seatRepository.saveAll(seats);
    }

}