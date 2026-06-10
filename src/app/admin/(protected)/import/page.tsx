import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { routes } from "@/config/routes";
import { CSV_COLUMNS } from "@/lib/admin/csv";
import { ImportUploader } from "@/components/admin/import-uploader";
import { ImportStatusBadge } from "@/components/admin/status-badges";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { ProductImportBatchRow } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminImportPage() {
  const { supabase } = await requireAdmin();

  const { data: batches } = await supabase
    .from("product_import_batches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">CSV 商品匯入</h1>
        <p className="text-sm text-muted-foreground">
          匯入的商品一律建立為「草稿」,人工審核後再上架;單列錯誤不會中止整批。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">上傳檔案</CardTitle>
          <CardDescription>
            欄位:{CSV_COLUMNS.join(", ")}。
            規格格式:voltage=24|V; current=10|A。品牌與分類需先存在(以名稱比對)。
            商品圖片不在匯入範圍,請於商品編輯頁上傳(確保授權)。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportUploader />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">匯入紀錄</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>檔名</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="text-right">總列數</TableHead>
                <TableHead className="text-right">成功</TableHead>
                <TableHead className="text-right">失敗</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(batches ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    尚無匯入紀錄。
                  </TableCell>
                </TableRow>
              ) : (
                ((batches ?? []) as ProductImportBatchRow[]).map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Link
                        href={routes.admin.importDetail(b.id)}
                        className="text-sm font-medium text-foreground hover:text-primary"
                      >
                        {b.original_filename}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(b.created_at)}
                    </TableCell>
                    <TableCell>
                      <ImportStatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{b.row_count}</TableCell>
                    <TableCell className="text-right tabular-nums text-green-700 dark:text-green-400">
                      {b.success_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-destructive">
                      {b.error_count}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
