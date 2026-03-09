package com.a505.jupasu.global.redis;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate stringRedisTemplate;

    /** GET — 키가 없으면 null 반환 */
    public String get(String key) {
        return stringRedisTemplate.opsForValue().get(key);
    }

    /** SETEX — TTL 포함 저장 */
    public void set(String key, String value, long ttlSeconds) {
        stringRedisTemplate.opsForValue().set(key, value, Duration.ofSeconds(ttlSeconds));
    }

    /**
     * SET key value EX ttl NX — 키가 없을 때만 저장 (원자적 락)
     * @return true: 락 획득 성공 (키 없었음) / false: 락 획득 실패 (키 이미 존재)
     */
    public boolean setIfAbsent(String key, String value, long ttlSeconds) {
        Boolean result = stringRedisTemplate.opsForValue()
                .setIfAbsent(key, value, Duration.ofSeconds(ttlSeconds));
        return Boolean.TRUE.equals(result);
    }

    /** INCR — 원자적으로 1 증가 후 증가된 값 반환 */
    public Long increment(String key) {
        return stringRedisTemplate.opsForValue().increment(key);
    }

    /** EXISTS */
    public boolean exists(String key) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(key));
    }

    /** DEL (단일 / 다수 키) */
    public void delete(String... keys) {
        stringRedisTemplate.delete(Arrays.asList(keys));
    }

    /**
     * Pipeline으로 다수 키를 한 번의 네트워크 왕복에 일괄 삭제
     * Redis cleanup에서 사용
     */
    public void deletePipelined(List<String> keys) {
        stringRedisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            for (String key : keys) {
                connection.keyCommands().del(key.getBytes());
            }
            return null;
        });
    }
}
