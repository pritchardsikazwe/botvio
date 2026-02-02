-- Assign super_admin role to sifotech@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('837a1fdd-31c2-43b5-9284-df4c997c4cae', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;