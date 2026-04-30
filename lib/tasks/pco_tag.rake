namespace :pco do
  desc <<~DESC
    Find all PCO households that contain a child and apply the kidsmin tag
    to each household's primary contact.

    Runs in DRY-RUN mode by default (no changes made).
    Pass APPLY=true to actually write the tag in PCO.

    Usage:
      bundle exec rails pco:tag_families_with_children
      bundle exec rails pco:tag_families_with_children APPLY=true
  DESC
  task tag_families_with_children: :environment do
    apply = ENV["APPLY"] == "true"
    tag_name = Kidsmin.configuration.pco_kids_ministry_tag.presence || "kidsmin"

    puts ""
    puts "=== PCO kidsmin tag backfill ==="
    puts "  Tag name : #{tag_name}"
    puts "  Mode     : #{apply ? "APPLY (will write to PCO)" : "DRY RUN (no changes)"}"
    puts ""

    client = Kidsmin::PcoClient.new

    # ── 1. Find the tag ──────────────────────────────────────────────────────
    puts "▶ Looking up tag '#{tag_name}'…"
    all_tags = client.get_all("/people/v2/tags", "where[name]" => tag_name)
    tag      = all_tags.find { |t| t.dig("attributes", "name") == tag_name }

    if tag.nil?
      abort <<~MSG

        ❌ Tag '#{tag_name}' not found in PCO.

        Create it first:
          PCO → People → More → Tags → New Tag Group
          Add a tag named exactly: #{tag_name}

        Then re-run this task.
      MSG
    end

    tag_id = tag["id"]
    puts "  Found tag id=#{tag_id}\n\n"

    # ── 2. Fetch everyone already bearing the tag ────────────────────────────
    puts "▶ Fetching people already tagged…"
    already_tagged_ids = client.get_all("/people/v2/tags/#{tag_id}/people")
                               .map { |p| p["id"] }
                               .to_set
    puts "  #{already_tagged_ids.size} people already have this tag\n\n"

    # ── 3. Fetch all people with household info ──────────────────────────────
    puts "▶ Fetching all people from PCO (paginated)…"
    response   = client.paginate("/people/v2/people", include: "households")
    all_people = response["data"]
    puts "  #{all_people.size} people fetched\n\n"

    # ── 4. Find households that have at least one child ──────────────────────
    puts "▶ Identifying households with children…"

    child_household_ids = all_people
      .select { |p| p.dig("attributes", "child") == true }
      .flat_map { |p| p.dig("relationships", "households", "data")&.map { |h| h["id"] } || [] }
      .to_set

    puts "  #{child_household_ids.size} households contain at least one child\n\n"

    # ── 5. Find primary contacts for those households ────────────────────────
    # The "primary contact" is the first non-child member of the household.
    adults_by_household = all_people
      .reject { |p| p.dig("attributes", "child") == true }
      .group_by { |p| p.dig("relationships", "households", "data", 0, "id") }

    to_tag   = []
    to_skip  = []

    child_household_ids.each do |hh_id|
      adults = adults_by_household[hh_id] || []
      next if adults.empty?

      primary = adults.first
      name    = "#{primary.dig("attributes", "first_name")} #{primary.dig("attributes", "last_name")}".strip
      pid     = primary["id"]

      if already_tagged_ids.include?(pid)
        to_skip << { id: pid, name: name, household: hh_id }
      else
        to_tag << { id: pid, name: name, household: hh_id }
      end
    end

    puts "  #{to_tag.size} people to tag"
    puts "  #{to_skip.size} already have the tag\n\n"

    if to_tag.empty?
      puts "✅ Nothing to do — all qualifying households are already tagged."
      exit 0
    end

    # ── 6. Preview ───────────────────────────────────────────────────────────
    puts "People that will receive the '#{tag_name}' tag:"
    to_tag.first(20).each { |p| puts "  #{p[:name].ljust(35)} (PCO id: #{p[:id]})" }
    puts "  … and #{to_tag.size - 20} more" if to_tag.size > 20
    puts ""

    unless apply
      puts "DRY RUN complete — no changes made."
      puts "Re-run with APPLY=true to apply the tag in PCO.\n\n"
      exit 0
    end

    # ── 7. Apply tags ────────────────────────────────────────────────────────
    puts "▶ Applying tag in PCO…"
    success = 0
    failed  = 0

    to_tag.each do |person|
      # JSON:API to-many relationship: add person to tag's "people" relationship
      response = client.post(
        "/people/v2/tags/#{tag_id}/relationships/people",
        {
          "data" => [{ "type" => "Person", "id" => person[:id] }]
        }
      )
      success += 1
      print "."
    rescue => e
      failed += 1
      puts "\n  ❌ Failed for #{person[:name]} (#{person[:id]}): #{e.message}"
    end

    puts ""
    puts ""
    puts "✅ Done — #{success} tagged, #{failed} failed."
    puts "Reload the admin dashboard and click 'Sync from PCO' to import them.\n\n"
  end
end
