package com.a505.jupasu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@EnableAsync
@SpringBootApplication
public class JupasuApplication {

    public static void main(String[] args) {
        SpringApplication.run(JupasuApplication.class, args);
    }

}
