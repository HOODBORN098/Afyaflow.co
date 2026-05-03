package com.afyaflow.demo.repository;

import com.afyaflow.demo.model.Bed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {
    // sql queries
    List<Bed> findByWardId(Long wardId);

    List<Bed> findByStatus(String status);
}
