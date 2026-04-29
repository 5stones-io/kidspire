class PcoSchemaAlignment < ActiveRecord::Migration[7.2]
  def up
    # ── 1. kidsmin_families ─────────────────────────────────────────────────
    # Split primary_contact_name → first_name + last_name (matches PCO Person)
    add_column :kidsmin_families, :primary_contact_first_name, :string
    add_column :kidsmin_families, :primary_contact_last_name,  :string

    execute <<~SQL
      UPDATE kidsmin_families
      SET
        primary_contact_first_name = split_part(primary_contact_name, ' ', 1),
        primary_contact_last_name  = CASE
          WHEN position(' ' IN primary_contact_name) > 0
            THEN substring(primary_contact_name FROM position(' ' IN primary_contact_name) + 1)
          ELSE ''
        END
      WHERE primary_contact_name IS NOT NULL
    SQL

    remove_column :kidsmin_families, :primary_contact_name

    # ── 2. kidsmin_children ─────────────────────────────────────────────────
    # grade: string ("3rd") → integer (3) to match PCO People::Person#grade
    # PCO grade enum: 0=Kindergarten, 1=1st … 12=12th
    add_column :kidsmin_children, :grade_level, :integer

    execute <<~SQL
      UPDATE kidsmin_children
      SET grade_level = CASE grade
        WHEN 'K'            THEN 0
        WHEN 'Kindergarten' THEN 0
        WHEN '1'  THEN 1   WHEN '1st'  THEN 1
        WHEN '2'  THEN 2   WHEN '2nd'  THEN 2
        WHEN '3'  THEN 3   WHEN '3rd'  THEN 3
        WHEN '4'  THEN 4   WHEN '4th'  THEN 4
        WHEN '5'  THEN 5   WHEN '5th'  THEN 5
        WHEN '6'  THEN 6   WHEN '6th'  THEN 6
        WHEN '7'  THEN 7   WHEN '7th'  THEN 7
        WHEN '8'  THEN 8   WHEN '8th'  THEN 8
        WHEN '9'  THEN 9   WHEN '9th'  THEN 9
        WHEN '10' THEN 10  WHEN '10th' THEN 10
        WHEN '11' THEN 11  WHEN '11th' THEN 11
        WHEN '12' THEN 12  WHEN '12th' THEN 12
        ELSE CAST(NULLIF(regexp_replace(COALESCE(grade,''), '[^0-9]', '', 'g'), '') AS INTEGER)
      END
      WHERE grade IS NOT NULL
    SQL

    remove_column :kidsmin_children, :grade
    rename_column :kidsmin_children, :grade_level, :grade

    # ── 3. kidsmin_events ───────────────────────────────────────────────────
    # Add location — direct field on PCO Calendar::Event
    add_column :kidsmin_events, :location, :string
  end

  def down
    # Families — restore combined name
    add_column :kidsmin_families, :primary_contact_name, :string
    execute <<~SQL
      UPDATE kidsmin_families
      SET primary_contact_name = trim(
        coalesce(primary_contact_first_name, '') || ' ' ||
        coalesce(primary_contact_last_name, '')
      )
    SQL
    remove_column :kidsmin_families, :primary_contact_first_name
    remove_column :kidsmin_families, :primary_contact_last_name

    # Children — restore grade as string
    add_column :kidsmin_children, :grade_str, :string
    execute <<~SQL
      UPDATE kidsmin_children
      SET grade_str = CASE grade
        WHEN 0 THEN 'K'
        WHEN 1 THEN '1st' WHEN 2  THEN '2nd'  WHEN 3  THEN '3rd'
        WHEN 4 THEN '4th' WHEN 5  THEN '5th'  WHEN 6  THEN '6th'
        WHEN 7 THEN '7th' WHEN 8  THEN '8th'  WHEN 9  THEN '9th'
        WHEN 10 THEN '10th' WHEN 11 THEN '11th' WHEN 12 THEN '12th'
      END
      WHERE grade IS NOT NULL
    SQL
    remove_column :kidsmin_children, :grade
    rename_column :kidsmin_children, :grade_str, :grade

    # Events
    remove_column :kidsmin_events, :location
  end
end
