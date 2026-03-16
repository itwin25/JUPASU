import { z } from 'zod';

/**
 * 회원가입 유효성 검사 스키마
 */
export const signupSchema = z
  .object({
    nickname: z
      .string()
      .min(2, '닉네임은 2자 이상이어야 합니다.')
      .max(10, '닉네임은 10자 이하이어야 합니다.'),
    email: z.string().email('올바른 이메일 형식이 아닙니다.').min(1, '이메일을 입력해주세요.'),
    authCode: z.string().min(1, '인증번호를 입력해주세요.'),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        '대문자, 숫자, 특수문자를 포함해야 합니다.',
      ),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
    isAgeChecked: z.boolean().refine((val) => val === true, {
      message: '만 19세 이상 동의가 필요합니다.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export type SignupSchema = z.infer<typeof signupSchema>;
