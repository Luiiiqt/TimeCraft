package com.timecraft.timecraft;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TimeCraft {

    public static void main(String[] args) {
        SpringApplication.run(TimeCraft.class, args);
    }
}