-- Update the user with phone 62993909390 to have 'dono' role
UPDATE public.user_roles 
SET role = 'dono' 
WHERE user_id = (
  SELECT id FROM public.profiles WHERE phone = '62993909390'
);