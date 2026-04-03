-- Enable extensions (Postgres assumed)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- TENANTS
-- =========================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    email TEXT NOT NULL,
    status TEXT CHECK (status IN ('active', 'disabled', 'pending')),
    profile JSONB,
    created_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP,
    UNIQUE (tenant_id, email),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- =========================
-- ORGANIZATION TREE (SELF REF)
-- =========================
CREATE TABLE org_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    parent_id UUID,
    name TEXT NOT NULL,
    path TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (parent_id) REFERENCES org_units(id)
);

-- =========================
-- ROLES & PERMISSIONS (M2M)
-- =========================
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    UNIQUE (tenant_id, name),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- =========================
-- USER ROLE ASSIGNMENTS (COMPOSITE)
-- =========================
CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- =========================
-- PROJECTS
-- =========================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    owner_id UUID,
    name TEXT NOT NULL,
    config JSONB,
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- =========================
-- PROJECT MEMBERS (M2M WITH ATTRS)
-- =========================
CREATE TABLE project_members (
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT,
    joined_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =========================
-- VERSIONED DOCUMENTS
-- =========================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    created_by UUID,
    title TEXT,
    current_version INT DEFAULT 1,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE document_versions (
    document_id UUID NOT NULL,
    version INT NOT NULL,
    content JSONB,
    created_at TIMESTAMP DEFAULT now(),
    created_by UUID,
    PRIMARY KEY (document_id, version),
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- =========================
-- TAGGING (POLYMORPHIC)
-- =========================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    label TEXT NOT NULL,
    UNIQUE (tenant_id, label),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- polymorphic reference: entity_type + entity_id
CREATE TABLE taggings (
    tag_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (tag_id, entity_type, entity_id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);

-- =========================
-- EVENTS (EVENT SOURCING STYLE)
-- =========================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- =========================
-- AUDIT LOG (POLYMORPHIC FK STYLE)
-- =========================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID,
    entity_type TEXT,
    entity_id UUID,
    action TEXT,
    changes JSONB,
    created_at TIMESTAMP DEFAULT now(),
    FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- =========================
-- PAYMENTS + INVOICES
-- =========================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    total_amount NUMERIC(12,2),
    status TEXT,
    issued_at TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID,
    amount NUMERIC(12,2),
    method TEXT,
    metadata JSONB,
    paid_at TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- =========================
-- SOFT DELETE INDEX
-- =========================
CREATE INDEX idx_users_active
ON users (tenant_id)
WHERE deleted_at IS NULL;

-- =========================
-- CROSS TABLE WEIRDNESS
-- =========================
ALTER TABLE documents
ADD CONSTRAINT fk_documents_current_version
FOREIGN KEY (id, current_version)
REFERENCES document_versions(document_id, version);

-- =========================
-- CYCLIC-LIKE DEPENDENCY TEST
-- =========================
CREATE TABLE dependencies (
    from_project UUID,
    to_project UUID,
    dependency_type TEXT,
    PRIMARY KEY (from_project, to_project),
    FOREIGN KEY (from_project) REFERENCES projects(id),
    FOREIGN KEY (to_project) REFERENCES projects(id)
);