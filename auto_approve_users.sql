-- Update handle_new_user to set status to 'Active' by default
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, status, phone, district, branch_id)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'Collector'),
    'Active', -- CHANGED FROM 'pending' TO 'Active'
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'zone',
    (new.raw_user_meta_data->>'branch_id')::bigint
  );
  return new;
end;
$$ language plpgsql security definer;

-- Optional: Auto-approve any currently pending users (Safe to run)
update public.profiles 
set status = 'Active' 
where status = 'pending';
