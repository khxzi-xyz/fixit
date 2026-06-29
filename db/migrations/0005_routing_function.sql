-- =============================================================================
-- Targeted routing match (PRD §2.A.2). The HARD ISOLATION RULE (category) and
-- geo radius are enforced here in the query layer, never client-side.
-- Called by the routing worker via supabase.rpc('eligible_vendors_for_job').
-- =============================================================================

CREATE OR REPLACE FUNCTION eligible_vendors_for_job(p_job_id UUID)
RETURNS TABLE (vendor_id UUID) AS $$
  SELECT vp.vendor_id
  FROM vendor_profiles vp
  JOIN jobs j ON j.job_id = p_job_id
  WHERE j.category_id = ANY (vp.category_ids)
    AND vp.verification_status = 'VERIFIED'
    AND vp.subscription_status IN ('ACTIVE', 'TRIAL')
    AND (
      vp.service_area_geom IS NULL
      OR ST_DWithin(vp.service_area_geom, j.location_geom, vp.radius_meters)
    );
$$ LANGUAGE sql STABLE;
