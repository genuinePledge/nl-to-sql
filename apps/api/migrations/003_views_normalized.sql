BEGIN;

-- Orders view (one row per order)
CREATE VIEW orders AS
SELECT DISTINCT ON (order_id)
    order_id,
    user_id,
    offset_hours,
    status_order,
    order_timestamp,
    order_modified_local,
    cancel_before_accept_local,
    distance_in_meters,
    duration_in_seconds,
    price_order_local,
    price_start_local
FROM ride_events
ORDER BY order_id, order_timestamp DESC;


-- Tenders view (one row per tender)
CREATE VIEW tenders AS
SELECT
    tender_id,
    order_id,
    driver_id,
    status_tender,
    tender_timestamp,
    price_tender_local,
    driveraccept_timestamp,
    driverarrived_timestamp,
    driverstarttheride_timestamp,
    driverdone_timestamp,
    clientcancel_timestamp,
    drivercancel_timestamp
FROM ride_events
WHERE tender_id IS NOT NULL;

COMMIT;
