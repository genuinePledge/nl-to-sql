BEGIN;

CREATE TABLE ride_events (
    city_id                    INTEGER NOT NULL,
    order_id                   TEXT NOT NULL,
    tender_id                  TEXT,

    user_id                    TEXT NOT NULL,
    driver_id                  TEXT,

    offset_hours               INTEGER NOT NULL,

    status_order               TEXT NOT NULL,
    status_tender              TEXT,

    order_timestamp            TIMESTAMP NOT NULL,
    tender_timestamp           TIMESTAMP,
    driveraccept_timestamp     TIMESTAMP,
    driverarrived_timestamp    TIMESTAMP,
    driverstarttheride_timestamp TIMESTAMP,
    driverdone_timestamp       TIMESTAMP,

    clientcancel_timestamp     TIMESTAMP,
    drivercancel_timestamp     TIMESTAMP,

    order_modified_local       TIMESTAMP,
    cancel_before_accept_local TIMESTAMP,

    distance_in_meters         INTEGER NOT NULL CHECK (distance_in_meters >= 0),
    duration_in_seconds        INTEGER NOT NULL CHECK (duration_in_seconds >= 0),

    price_order_local          NUMERIC(12,2) NOT NULL CHECK (price_order_local >= 0),
    price_tender_local         NUMERIC(12,2),
    price_start_local          NUMERIC(12,2) NOT NULL CHECK (price_start_local >= 0)
);

COMMIT;
