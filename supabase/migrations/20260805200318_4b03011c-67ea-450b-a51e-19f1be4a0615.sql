CREATE POLICY "Admins can read all feedback"
ON public.user_feedback
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));