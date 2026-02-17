CREATE TABLE IF NOT EXISTS config (
    key VARCHAR PRIMARY KEY,
    value VARCHAR
);

CREATE TABLE IF NOT EXISTS record (
    id VARCHAR PRIMARY KEY,
    date DATE NOT NULL,
    record_type VARCHAR NOT NULL CHECK (record_type IN ('CREDIT', 'DEBIT')),
    amount DOUBLE NOT NULL,
    description VARCHAR NOT NULL,
    source_file VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS tag (
    id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS record_tag (
    record_id VARCHAR NOT NULL REFERENCES record (id),
    tag_id INTEGER NOT NULL REFERENCES tag (id),
    PRIMARY KEY (record_id, tag_id)
);
