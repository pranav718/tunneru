package tui

import "github.com/charmbracelet/lipgloss"

const (
	ColorBackground = "#120f11"
	ColorCardPanel  = "#1e1a1c"
	ColorCardAlt    = "#1a1518"
)

const (
	ColorTextPrimary   = "#E7D0C8"
	ColorTextSecondary = "#AAA7AE"
	ColorTextDim       = "#6b6468"
)

const (
	ColorSuccess = "#B7F1E0"
	ColorWarning = "#FBCA89"
	ColorError   = "#E98389"
)

const (
	ColorMethodGET     = "#81D1D0"
	ColorMethodPOST    = "#E7D0C8"
	ColorMethodPUT     = "#FBCA89"
	ColorMethodDELETE  = "#E98389"
	ColorMethodPATCH   = "#AAA7AE"
	ColorMethodHEAD    = "#81D1D0"
	ColorMethodOPTIONS = "#6b6468"
)

const (
	ColorBorderNormal = "#AAA7AE"
	ColorBorderSubtle = "#2a2427"
	ColorBorderAccent = "#E7D0C8"
)

var HeaderStyle = lipgloss.NewStyle().
	Background(lipgloss.Color(ColorCardPanel)).
	Padding(1, 2).
	Border(lipgloss.RoundedBorder()).
	BorderForeground(lipgloss.Color(ColorBorderNormal))

var BrandStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorTextPrimary)).
	Bold(true)

var VersionStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorTextSecondary))

func StatusPillStyle(status string) lipgloss.Style {
	var color string
	switch status {
	case "connected":
		color = ColorSuccess
	case "connecting", "reconnecting":
		color = ColorWarning
	case "disconnected":
		color = ColorError
	default:
		color = ColorTextSecondary
	}
	return lipgloss.NewStyle().
		Foreground(lipgloss.Color(color)).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color(color)).
		Padding(0, 1)
}

var InfoCardStyle = lipgloss.NewStyle().
	Background(lipgloss.Color(ColorCardPanel)).
	Border(lipgloss.RoundedBorder()).
	BorderForeground(lipgloss.Color(ColorBorderNormal)).
	Padding(1, 2).
	MarginTop(1)

var InfoLabelStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorTextSecondary)).
	Width(12)

var InfoValueStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorTextPrimary))

var TableHeaderStyle = lipgloss.NewStyle().
	Background(lipgloss.Color(ColorCardPanel)).
	Foreground(lipgloss.Color(ColorTextSecondary)).
	Padding(0, 2)

func RowStyle(alternate bool) lipgloss.Style {
	bg := ColorBackground
	if alternate {
		bg = ColorCardAlt
	}
	return lipgloss.NewStyle().
		Background(lipgloss.Color(bg)).
		Padding(0, 2)
}

var TimeStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorTextSecondary)).
	Width(10)

func MethodBadgeStyle(method string) lipgloss.Style {
	var color string
	switch method {
	case "GET":
		color = ColorMethodGET
	case "POST":
		color = ColorMethodPOST
	case "PUT":
		color = ColorMethodPUT
	case "DELETE":
		color = ColorMethodDELETE
	case "PATCH":
		color = ColorMethodPATCH
	case "HEAD":
		color = ColorMethodHEAD
	case "OPTIONS":
		color = ColorMethodOPTIONS
	default:
		color = ColorTextDim
	}
	return lipgloss.NewStyle().
		Foreground(lipgloss.Color(color)).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color(color)).
		Padding(0, 1).
		Width(8)
}

var PathStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorTextPrimary)).
	Width(36)

func StatusBadgeStyle(code int) lipgloss.Style {
	var color string
	bold := false
	switch {
	case code >= 200 && code < 300:
		color = ColorSuccess
	case code >= 300 && code < 400:
		color = ColorWarning
	case code >= 400 && code < 500:
		color = ColorError
	case code >= 500:
		color = ColorError
		bold = true
	default:
		color = ColorTextDim
	}
	return lipgloss.NewStyle().
		Foreground(lipgloss.Color(color)).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color(color)).
		Padding(0, 1).
		Width(16).
		Bold(bold)
}

func LatencyStyle(ms int) lipgloss.Style {
	var color string
	switch {
	case ms < 50:
		color = ColorTextSecondary
	case ms <= 200:
		color = ColorWarning
	default:
		color = ColorError
	}
	return lipgloss.NewStyle().
		Foreground(lipgloss.Color(color))
}

var StatusBarStyle = lipgloss.NewStyle().
	Background(lipgloss.Color(ColorCardPanel)).
	Border(lipgloss.RoundedBorder()).
	BorderForeground(lipgloss.Color(ColorBorderNormal)).
	Padding(0, 2)

var CountStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorTextPrimary)).
	Bold(true)

var OkCountStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorSuccess))

var ErrorCountStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorError))

var AvgLatencyStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorTextSecondary))

var KeybindStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorTextDim))

var DividerStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color(ColorBorderSubtle))
