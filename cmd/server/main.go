package main

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "tunneru-server",
	Short: "tunneru tunnel server: expose local ports to the internet",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("tunneru server v0.1.0")
		fmt.Println("control port: 7000")
		fmt.Println("ready. (no listeners started yet)")
	},
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
