package com.afyaflow.demo.repository;

import com.afyaflow.demo.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    // sql queries
    java.util.Optional<Department> findByName(String name);
}
