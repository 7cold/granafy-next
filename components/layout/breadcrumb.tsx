import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "../ui/breadcrumb";

type BreadCrumbProps = {
    title: string
}

export function BreadCrumb({ title }: BreadCrumbProps) {
    return (
        <Breadcrumb className="flex h-16 items-center gap-2 border-b px-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href="#">{title}</BreadcrumbLink>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    )
}