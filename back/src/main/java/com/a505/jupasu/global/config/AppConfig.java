package com.a505.jupasu.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    /**
     * Python AI 서버 등 내부 서비스 HTTP 호출에 사용하는 RestTemplate 빈
     */
    @Bean
    public RestTemplate restTemplate() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000); // 15초
        factory.setReadTimeout(15000);    // 15초
        return new RestTemplate(factory);
    }
}
