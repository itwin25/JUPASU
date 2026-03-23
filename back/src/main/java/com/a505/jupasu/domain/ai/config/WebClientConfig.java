package com.a505.jupasu.domain.ai.config;

import io.netty.channel.ChannelOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

/**
 * [Spring 초보자 가이드]
 * @Configuration: 이 클래스가 Spring의 설정 파일임을 나타냅니다. 
 * 여기서 만든 객체(Bean)들은 애플리케이션 전체에서 공유하여 사용할 수 있습니다.
 */
@Configuration
public class WebClientConfig {

    /**
     * @Value: application.properties 파일에 정의된 값을 가져옵니다.
     * 예: ai.server.base-url=http://... 값을 baseUrl 변수에 자동으로 넣어줍니다.
     */
    @Value("${ai.server.base-url}")
    private String baseUrl;

    @Value("${ai.server.connect-timeout:5000}")
    private int connectTimeout;

    @Value("${ai.server.read-timeout:60000}")
    private int readTimeout;

    @Value("${ai.server.internal-api-key}")
    private String internalApiKey;

    /**
     * @Bean: 이 메서드가 반환하는 객체(WebClient)를 Spring이 관리하는 바구니(Container)에 등록합니다.
     * 이제 다른 클래스에서 이 WebClient를 "주입(Injection)"받아 사용할 수 있습니다.
     */
    @Bean
    public WebClient webClient() {
        // 1. 실제 통신을 담당하는 밑단 클라이언트(HttpClient)를 설정합니다.
        HttpClient httpClient = HttpClient.create()
                // 연결 시도 제한 시간 (서버가 응답이 없을 때 얼마나 기다릴지)
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeout)
                // 전체 응답 완료 대기 시간 (데이터를 받는 중에 너무 오래 걸리면 끊기)
                .responseTimeout(Duration.ofMillis(readTimeout));

        // 2. WebClient 빌더를 사용하여 최종 도구를 만듭니다.
        return WebClient.builder()
                .baseUrl(baseUrl) // 모든 요청의 기본 주소 설정
                .defaultHeader("X-Internal-Api-Key", internalApiKey) // [추가] 내부 보안 인증 헤더
                .clientConnector(new ReactorClientHttpConnector(httpClient)) // 위에서 만든 설정 적용
                .build();
    }
}
