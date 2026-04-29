# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_04_28_000010) do
  create_schema "auth"
  create_schema "extensions"
  create_schema "graphql"
  create_schema "graphql_public"
  create_schema "pgbouncer"
  create_schema "realtime"
  create_schema "storage"
  create_schema "vault"

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_stat_statements"
  enable_extension "pgcrypto"
  enable_extension "plpgsql"
  enable_extension "supabase_vault"
  enable_extension "uuid-ossp"

  create_table "kidsmin_children", force: :cascade do |t|
    t.bigint "family_id", null: false
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.date "birthdate"
    t.text "notes"
    t.string "pco_person_id"
    t.datetime "pco_last_synced_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "grade"
    t.uuid "public_id", default: -> { "gen_random_uuid()" }, null: false
    t.index ["family_id"], name: "index_kidsmin_children_on_family_id"
    t.index ["pco_person_id"], name: "index_kidsmin_children_on_pco_person_id"
    t.index ["public_id"], name: "index_kidsmin_children_on_public_id", unique: true
  end

  create_table "kidsmin_church_integrations", force: :cascade do |t|
    t.string "token_type", null: false
    t.text "access_token"
    t.text "refresh_token"
    t.string "scope"
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "kidsmin_events", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.datetime "event_date", null: false
    t.integer "age_min"
    t.integer "age_max"
    t.integer "capacity"
    t.string "pco_event_id"
    t.string "pco_source"
    t.datetime "pco_last_synced_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "location"
    t.index ["event_date"], name: "index_kidsmin_events_on_event_date"
    t.index ["pco_event_id"], name: "index_kidsmin_events_on_pco_event_id", unique: true, where: "(pco_event_id IS NOT NULL)"
  end

  create_table "kidsmin_families", force: :cascade do |t|
    t.string "supabase_uid", null: false
    t.string "family_name"
    t.string "email"
    t.string "phone"
    t.string "pco_person_id"
    t.string "pco_household_id"
    t.boolean "pco_sync_enabled", default: true, null: false
    t.datetime "pco_last_synced_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "primary_contact_first_name"
    t.string "primary_contact_last_name"
    t.string "address"
    t.index ["email"], name: "index_kidsmin_families_on_email"
    t.index ["pco_household_id"], name: "index_kidsmin_families_on_pco_household_id"
    t.index ["pco_person_id"], name: "index_kidsmin_families_on_pco_person_id"
    t.index ["supabase_uid"], name: "index_kidsmin_families_on_supabase_uid", unique: true
  end

  create_table "kidsmin_invitations", force: :cascade do |t|
    t.bigint "family_id", null: false
    t.string "token", null: false
    t.datetime "expires_at", null: false
    t.datetime "accepted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["family_id"], name: "index_kidsmin_invitations_on_family_id"
    t.index ["token"], name: "index_kidsmin_invitations_on_token", unique: true
  end

  create_table "kidsmin_registrations", force: :cascade do |t|
    t.bigint "family_id", null: false
    t.bigint "event_id", null: false
    t.bigint "child_id", null: false
    t.boolean "synced_to_pco", default: false, null: false
    t.datetime "pco_synced_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["child_id", "event_id"], name: "index_kidsmin_registrations_on_child_id_and_event_id", unique: true
    t.index ["child_id"], name: "index_kidsmin_registrations_on_child_id"
    t.index ["event_id"], name: "index_kidsmin_registrations_on_event_id"
    t.index ["family_id"], name: "index_kidsmin_registrations_on_family_id"
  end

  create_table "kidsmin_sync_settings", force: :cascade do |t|
    t.boolean "inbound_people_sync", default: true, null: false
    t.boolean "outbound_people_sync", default: false, null: false
    t.boolean "inbound_events_sync", default: true, null: false
    t.boolean "outbound_registrations_sync", default: false, null: false
    t.integer "sync_frequency_hours", default: 6, null: false
    t.string "conflict_resolution", default: "pco_wins", null: false
    t.datetime "last_synced_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "kidsmin_children", "kidsmin_families", column: "family_id"
  add_foreign_key "kidsmin_invitations", "kidsmin_families", column: "family_id"
  add_foreign_key "kidsmin_registrations", "kidsmin_children", column: "child_id"
  add_foreign_key "kidsmin_registrations", "kidsmin_events", column: "event_id"
  add_foreign_key "kidsmin_registrations", "kidsmin_families", column: "family_id"
end
