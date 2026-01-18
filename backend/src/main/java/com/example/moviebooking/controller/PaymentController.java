package com.example.moviebooking.controller;

import com.example.moviebooking.Service.BookingService;
import com.example.moviebooking.Service.PaymentService;
import com.razorpay.RazorpayException;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@CrossOrigin
public class PaymentController {

    private final PaymentService paymentService;
    private final BookingService bookingService;

    public PaymentController(PaymentService paymentService, BookingService bookingService) {
        this.paymentService = paymentService;
        this.bookingService = bookingService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> request) {
        try {
            int amount = (Integer) request.get("amount");
            Map<String, Object> orderData = paymentService.createOrder(amount);
            return ResponseEntity.ok(orderData);
        } catch (RazorpayException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create order");
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, Object>> confirmPayment(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();

        try {
            String paymentId = (String) request.get("paymentId");
            String orderId = (String) request.get("orderId");
            String signature = (String) request.get("signature");

            @SuppressWarnings("unchecked")
            List<Integer> holdIdsInt = (List<Integer>) request.get("holdIds");
            List<Long> holdIds = holdIdsInt.stream()
                    .map(Integer::longValue)
                    .toList();

            // Verify payment signature
            boolean isValid = paymentService.verifySignature(orderId, paymentId, signature);

            if (isValid) {
                // Confirm booking and convert holds to bookings
                bookingService.confirmBooking(holdIds);

                response.put("success", true);
                response.put("message", "Payment confirmed and seats booked");

                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Invalid payment signature");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Payment confirmation failed");
            return ResponseEntity.badRequest().body(response);
        }
    }
}