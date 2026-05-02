package com.afyaflow.demo.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DoctorSyncInitializer {

    @Bean
    public CommandLineRunner syncDoctors() {
        return args -> {
            // Disabled for faster startup
        };
    }
}
