package com.a505.jupasu.global.redis;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
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

    /** EXPIRE — 키의 만료 시간을 설정 */
    public void expire(String key, long ttlSeconds) {
        stringRedisTemplate.expire(key, Duration.ofSeconds(ttlSeconds));
    }

    /** TTL — 키의 남은 만료 시간(초) 반환 / 키 없음 또는 TTL 없음이면 -1 */
    public long getTtl(String key) {
        Long ttl = stringRedisTemplate.getExpire(key);
        return (ttl == null || ttl < 0) ? -1 : ttl;
    }

    /** EXISTS */
    public boolean exists(String key) {
        return Boolean.TRUE.equals(stringRedisTemplate.hasKey(key));
    }

    /** 키의 남은 시간(TTL)을 더해 "HH:mm" 형태의 잠금 해제 시각 문자열을 반환 */
    public String getUnlockTimeAsString(String key, long defaultTtlIfMissing) {
        long ttlSeconds = getTtl(key);
        return LocalDateTime.now()
                .plusSeconds(ttlSeconds > 0 ? ttlSeconds : defaultTtlIfMissing)
                .format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    /** DEL (단일 / 다수 키) */
    public void delete(String... keys) {
        stringRedisTemplate.delete(Arrays.asList(keys));
    }

    /** List Push — 리스트의 왼쪽에 데이터 추가 */
    public void pushToList(String key, String value) {
        stringRedisTemplate.opsForList().leftPush(key, value);
    }

    /** List Trim — 리스트 크기를 일정 개수로 유지 */
    public void trimList(String key, long maxSize) {
        stringRedisTemplate.opsForList().trim(key, 0, maxSize - 1);
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

    /**
     * Lua 스크립트를 Redis에 전송
     * @param script RedisScript (반환 타입 포함)
     * @param keys   KEYS 목록
     * @param args   ARGV 목록 (String)
     * @return 스크립트 반환값
     */
    public <T> T executeScript(RedisScript<T> script, List<String> keys, String... args) {
        return stringRedisTemplate.execute(script, keys, args);
    }
}
