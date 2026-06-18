import { formatInAppTz } from "@/lib/dates";
import { DumpCapture } from "@/components/dump-capture";
import { DumpList } from "@/components/dump-list";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/db";
import { getProjectOptions } from "@/lib/queries";
import type { DumpItemData } from "@/components/dump-list";

export const dynamic = "force-dynamic";

export default async function BrainDumpPage() {
  const [items, projectOptions] = await Promise.all([
    prisma.brainDumpItem.findMany({
      include: { project: true },
      orderBy: { createdAt: "desc" },
    }),
    getProjectOptions(),
  ]);

  const toItem = (d: (typeof items)[number]): DumpItemData => ({
    id: d.id,
    title: d.title,
    notes: d.notes,
    category: d.category,
    status: d.status,
    projectId: d.projectId,
    projectName: d.project?.name ?? null,
    createdAt: formatInAppTz(d.createdAt, "MMM d"),
  });

  const inbox = items.filter((d) => d.status === "inbox").map(toItem);
  const reviewed = items.filter((d) => d.status === "reviewed").map(toItem);
  const converted = items.filter((d) => d.status === "converted").map(toItem);
  const archived = items.filter((d) => d.status === "archived").map(toItem);

  return (
    <div>
      <PageHeader
        title="Brain Dump"
        subtitle="Get it out of your head. Sort it later."
      />

      <DumpCapture projects={projectOptions} />

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox · {inbox.length}</TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed · {reviewed.length}
          </TabsTrigger>
          <TabsTrigger value="converted">
            Converted · {converted.length}
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived · {archived.length}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" className="mt-4">
          <DumpList
            items={inbox}
            projects={projectOptions}
            emptyTitle="Inbox is clear"
            emptyDescription="Nice. Capture anything new the moment it shows up."
          />
        </TabsContent>
        <TabsContent value="reviewed" className="mt-4">
          <DumpList
            items={reviewed}
            projects={projectOptions}
            emptyTitle="Nothing reviewed"
            emptyDescription="Move inbox items here once you've looked at them."
          />
        </TabsContent>
        <TabsContent value="converted" className="mt-4">
          <DumpList
            items={converted}
            projects={projectOptions}
            emptyTitle="Nothing converted yet"
            emptyDescription="Ideas you turn into tasks land here."
          />
        </TabsContent>
        <TabsContent value="archived" className="mt-4">
          <DumpList
            items={archived}
            projects={projectOptions}
            emptyTitle="Nothing archived"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
