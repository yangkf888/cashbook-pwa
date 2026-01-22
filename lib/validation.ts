import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少 8 位")
});

export const createSpaceSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(50, "名称过长")
});
