package com.afyaflow.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.afyaflow.demo.model.Department;
import com.afyaflow.demo.repository.DepartmentRepository;

@Service
@SuppressWarnings("null")
public class DepartmentService {

    private final DepartmentRepository repository;

    public DepartmentService(DepartmentRepository repository) {
        this.repository = repository;
    }

    public Department createDepartment(Department department) {
        return repository.save(department);
    }

    public List<Department> getDepartments() {
        return repository.findAll();
    }

    public void deleteDepartment(Long id) {
        repository.deleteById(id);
    }

    public Department getDepartment(Long id) {
        return repository.findById(id).orElse(null);
    }
}
