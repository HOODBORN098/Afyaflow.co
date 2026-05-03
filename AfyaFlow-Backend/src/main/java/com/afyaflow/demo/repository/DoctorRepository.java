package com.afyaflow.demo.repository;

import com.afyaflow.demo.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {

    // sql queries
    List<Doctor> findByDepartmentId(Long departmentId);

    java.util.Optional<Doctor> findByEmail(String email);

}
