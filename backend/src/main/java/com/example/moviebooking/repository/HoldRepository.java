package com.example.moviebooking.repository;

import com.example.moviebooking.Entity.Hold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HoldRepository extends JpaRepository<Hold, Long> {

    @Query("SELECT h FROM Hold h WHERE h.expiryTime < :currentTime AND h.status = 'ACTIVE'")
    List<Hold> findExpiredHolds(LocalDateTime currentTime);

    List<Hold> findByIdIn(List<Long> ids);
}