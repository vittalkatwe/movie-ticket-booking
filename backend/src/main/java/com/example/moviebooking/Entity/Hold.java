package com.example.moviebooking.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "hold")
public class Hold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    private String userName;
    private String userEmail;
    private String userPhone;

    private LocalDateTime holdTime;
    private LocalDateTime expiryTime;

    @Enumerated(EnumType.STRING)
    private HoldStatus status;

    public Hold() {}

    public Hold(Seat seat, String userName, String userEmail, String userPhone) {
        this.seat = seat;
        this.userName = userName;
        this.userEmail = userEmail;
        this.userPhone = userPhone;
        this.holdTime = LocalDateTime.now();
        this.expiryTime = holdTime.plusMinutes(6);
        this.status = HoldStatus.ACTIVE;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public Seat getSeat() {
        return seat;
    }

    public void setSeat(Seat seat) {
        this.seat = seat;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }

    public LocalDateTime getHoldTime() {
        return holdTime;
    }

    public void setHoldTime(LocalDateTime holdTime) {
        this.holdTime = holdTime;
    }

    public LocalDateTime getExpiryTime() {
        return expiryTime;
    }

    public void setExpiryTime(LocalDateTime expiryTime) {
        this.expiryTime = expiryTime;
    }

    public HoldStatus getStatus() {
        return status;
    }

    public void setStatus(HoldStatus status) {
        this.status = status;
    }
}
