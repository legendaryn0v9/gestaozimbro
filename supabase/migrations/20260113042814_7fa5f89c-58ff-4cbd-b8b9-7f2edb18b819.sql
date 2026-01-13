-- Create admin_actions table to track gestor/dono actions
CREATE TABLE public.admin_actions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    target_user_id UUID,
    target_user_name TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins and donos can view admin actions
CREATE POLICY "Admins can view all admin actions"
ON public.admin_actions
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only authenticated users can insert their own actions
CREATE POLICY "Authenticated users can insert their own actions"
ON public.admin_actions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_admin_actions_created_at ON public.admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_user_id ON public.admin_actions(user_id);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_actions;