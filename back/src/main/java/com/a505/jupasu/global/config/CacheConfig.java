package com.a505.jupasu.global.config;


import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

import tools.jackson.databind.cfg.JsonNodeFeature;
import tools.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import tools.jackson.databind.jsontype.PolymorphicTypeValidator;


@EnableCaching
@Configuration
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManeger(RedisConnectionFactory redisConnectionFactory) {

        // JSON 직렬화/역직렬화 규칙상세 설정
        PolymorphicTypeValidator typeValidator = BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType(Object.class)
                .build();


        // 위에서 만든 규칙을 적용한 serializer 생성
        GenericJacksonJsonRedisSerializer serializer = GenericJacksonJsonRedisSerializer.builder()
                .enableDefaultTyping(typeValidator)
                .enableSpringCacheNullValueSupport()
                .customize(builder -> {
                    // Jackson 3용 JsonMapper.Builder 커스터마이징 예시
                    builder.disable(JsonNodeFeature.READ_NULL_PROPERTIES);
                    builder.findAndAddModules();
                })
                .build();


        RedisCacheConfiguration redisCacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                //key String으로 직렬화
                .serializeKeysWith(
                        RedisSerializationContext
                                .SerializationPair
                                .fromSerializer(new StringRedisSerializer())
                )
                //value 는 JSON 으로 직렬화
                .serializeValuesWith(
                        RedisSerializationContext
                                .SerializationPair
                                .fromSerializer(serializer)
                )
                //기본 ttl 30분 설정
                .entryTtl(Duration.ofMinutes(30L));


        return RedisCacheManager.RedisCacheManagerBuilder
                .fromConnectionFactory(redisConnectionFactory)
                .cacheDefaults(redisCacheConfiguration)
                .build();
    }
}
