-- Public read policies for published doctor, blog and case content include
-- private.is_active_staff() so authenticated staff can also see drafts.
-- PostgreSQL may evaluate both sides of OR expressions, so anonymous reads
-- need EXECUTE on this SECURITY DEFINER helper. With auth.uid() = null the
-- helper safely returns false.
grant execute on function private.is_active_staff() to anon;
