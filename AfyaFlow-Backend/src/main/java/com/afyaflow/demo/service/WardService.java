package com.afyaflow.demo.service;

import com.afyaflow.demo.model.Bed;
import com.afyaflow.demo.model.Ward;
import com.afyaflow.demo.repository.BedRepository;
import com.afyaflow.demo.repository.WardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class WardService {

    @Autowired
    private WardRepository wardRepository;

    @Autowired
    private BedRepository bedRepository;

    public List<Ward> getAllWards() {
        return wardRepository.findAll();
    }

    public List<Bed> getBedsByWard(Long wardId) {
        if (wardId == null) return java.util.Collections.emptyList();
        return bedRepository.findByWardId(wardId);
    }

    public Bed updateBedStatus(Long bedId, String status, String patientId, String patientName) {
        if (bedId == null) throw new IllegalArgumentException("BedId cannot be null");
        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new RuntimeException("Bed not found"));
        bed.setStatus(status);
        bed.setPatientId(patientId);
        bed.setPatientName(patientName);
        if ("occupied".equals(status)) {
            bed.setAdmittedAt(new java.util.Date().toString());
        } else {
            bed.setAdmittedAt(null);
        }
        return bedRepository.save(bed);
    }

    public Ward saveWard(Ward ward) {
        if (ward == null) throw new IllegalArgumentException("Ward cannot be null");
        Ward savedWard = wardRepository.save(ward);
        
        List<Bed> existingBeds = bedRepository.findByWardId(savedWard.getId());
        int currentCount = existingBeds.size();
        int targetCapacity = savedWard.getCapacity() != null ? savedWard.getCapacity() : 0;

        if (currentCount < targetCapacity) {
            for (int i = currentCount + 1; i <= targetCapacity; i++) {
                Bed bed = Bed.builder()
                        .bedNumber(String.valueOf(i))
                        .wardId(savedWard.getId())
                        .status("available")
                        .build();
                bedRepository.save(bed);
            }
        }
        return savedWard;
    }

    public Bed saveBed(Bed bed) {
        if (bed == null) throw new IllegalArgumentException("Bed cannot be null");
        return bedRepository.save(bed);
    }
}
