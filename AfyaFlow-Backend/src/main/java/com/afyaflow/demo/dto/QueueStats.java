package com.afyaflow.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueStats {
    private int userPosition;
    private int totalInQueue;
    private int estimatedWaitTime;
    private String doctorStatus;
    private int patientsAhead;
}
