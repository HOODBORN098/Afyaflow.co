package com.afyaflow.demo.service;

import com.afyaflow.demo.model.Queue;
import com.afyaflow.demo.repository.QueueRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class QueueService {

    private final QueueRepository repository;

    public QueueService(QueueRepository repository) {
        this.repository = repository;
    }

    public Queue addToQueue(Queue queue) {
        return repository.save(queue);
    }

    public List<Queue> getQueue() {
        return repository.findAll();
    }

    public List<Queue> getQueueByDoctor(Long doctorId) {
        return repository.findByDoctorId(doctorId);
    }
}
