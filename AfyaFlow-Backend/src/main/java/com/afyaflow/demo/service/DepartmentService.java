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

    @jakarta.annotation.PostConstruct
    public void init() {
        if (repository.findByName("General").isEmpty()) {
            Department d = new Department();
            d.setName("General");
            d.setDescription("The primary point of contact for patient consultations and initial medical assessments.");
            repository.save(d);
        }
    }

    public Department createDepartment(Department department) {
        if (department.getDescription() == null || department.getDescription().isEmpty()) {
            department.setDescription("Providing specialized diagnostic and treatment services with state-of-the-art technology in " + department.getName() + ".");
        }
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
