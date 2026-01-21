import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

export type DataTableColumn = {
    key: string;
    label: ReactNode;
    align?: 'left' | 'center' | 'right';
};

type DataTableProps<T> = {
    columns: DataTableColumn[];
    rows: T[];
    gridTemplateColumns: string;
    rowKey: (row: T) => string | number;
    renderRow: (row: T) => ReactNode[];
    isLoading?: boolean;
    emptyMessage?: string;
    statusContent?: ReactNode;
    onRowClick?: (row: T) => void;
    showHeader?: boolean;
};

const baseCellSx = {
    paddingY: 1.4,
    paddingX: 1.5,
    borderRight: '1px solid rgba(0,0,0,0.3)',
    borderBottom: '1px solid rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    minWidth: 0
};

const resolveAlignment = (align: DataTableColumn['align']) => {
    if (align === 'center') {
        return 'center';
    }

    if (align === 'right') {
        return 'flex-end';
    }

    return 'flex-start';
};

const TableCell = ({
    children,
    isLast,
    align,
    isHeader
}: {
    children: ReactNode;
    isLast: boolean;
    align?: DataTableColumn['align'];
    isHeader?: boolean;
}) => (
    <Box
        sx={{
            ...baseCellSx,
            borderRight: isLast ? 'none' : baseCellSx.borderRight,
            fontWeight: isHeader ? 600 : 400,
            justifyContent: resolveAlignment(align)
        }}
    >
        {children}
    </Box>
);

const renderHeaderLabel = (label: ReactNode) => {
    if (typeof label === 'string' || typeof label === 'number') {
        return <Typography variant="body2">{label}</Typography>;
    }

    return label;
};

export const DataTable = <T,>({
    columns,
    rows,
    gridTemplateColumns,
    rowKey,
    renderRow,
    isLoading = false,
    emptyMessage = 'Данные отсутствуют.',
    statusContent,
    onRowClick,
    showHeader = true
}: DataTableProps<T>) => {
    const hasRows = rows.length > 0;

    const content = () => {
        if (statusContent) {
            return <Box sx={{ padding: 2 }}>{statusContent}</Box>;
        }

        if (isLoading) {
            return (
                <Box sx={{ padding: 2 }}>
                    <Typography variant="body2">Загрузка...</Typography>
                </Box>
            );
        }

        if (!hasRows) {
            return (
                <Box sx={{ padding: 2 }}>
                    <Typography variant="body2">{emptyMessage}</Typography>
                </Box>
            );
        }

        return rows.map((row) => {
            const cells = renderRow(row);
            return (
                <Box
                    key={rowKey(row)}
                    sx={{
                        display: 'grid',
                        gridTemplateColumns,
                        alignItems: 'stretch',
                        width: '100%',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'background-color 0.2s ease',
                        '&:hover': {
                            backgroundColor: '#ffffff'
                        },
                        cursor: onRowClick ? 'pointer' : 'default'
                    }}
                    onClick={() => onRowClick?.(row)}
                >
                    {cells.map((cell, index) => (
                        <TableCell
                            key={`${columns[index]?.key ?? index}`}
                            isLast={index === columns.length - 1}
                            align={columns[index]?.align}
                        >
                            {cell}
                        </TableCell>
                    ))}
                </Box>
            );
        });
    };

    return (
        <Box
            sx={{
                backgroundColor: '#d9d9d9',
                borderRadius: 2,
                padding: 2,
                border: '1px solid rgba(0,0,0,0.3)',
                overflow: 'hidden'
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {showHeader && (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns,
                            alignItems: 'stretch',
                            width: '100%'
                        }}
                    >
                        {columns.map((column, index) => (
                            <TableCell
                                key={column.key}
                                isLast={index === columns.length - 1}
                                align={column.align}
                                isHeader
                            >
                                {renderHeaderLabel(column.label)}
                            </TableCell>
                        ))}
                    </Box>
                )}
                {content()}
            </Box>
        </Box>
    );
};