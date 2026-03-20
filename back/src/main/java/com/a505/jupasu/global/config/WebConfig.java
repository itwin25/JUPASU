package com.a505.jupasu.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // ⭐️ 슬래시를 1개로 줄입니다! (file:/app/...)
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:/app/uploads/images/");
    }
}