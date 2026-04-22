BEGIN;

-- Ensure no duplicate tender rows per order
ALTER TABLE ride_events
ADD CONSTRAINT uq_order_tender UNIQUE (order_id, tender_id);

-- Indexes for common queries
CREATE INDEX idx_ride_events_order_id ON ride_events(order_id);
CREATE INDEX idx_ride_events_tender_id ON ride_events(tender_id);

CREATE INDEX idx_ride_events_order_ts ON ride_events(order_timestamp);
CREATE INDEX idx_ride_events_tender_ts ON ride_events(tender_timestamp);

CREATE INDEX idx_ride_events_status_order ON ride_events(status_order);
CREATE INDEX idx_ride_events_status_tender ON ride_events(status_tender);

COMMIT;
